sub error1()
    for i = 0 to 10
        a = i
    end for
    print "a"; a 'error
end sub

sub error2()
    aa = {}
    if aa <> invalid
        for each a in aa
            b = a
        end for
    end if
    print "b"; b 'error
end sub

sub ok1()
    a = invalid
    for i = 0 to 10
        a = i
    end for
    print "a"; a
end sub

sub ok2()
    aa = {}
    b = invalid
    if aa <> invalid
        for each a in aa
            b = a
        end for
    end if
    print "b"; b
end sub
