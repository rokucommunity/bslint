sub error1()
    for i = 0 to 10
        print "i"; i
    end for
    print "i"; i 'error
end sub

sub error2()
    aa = {}
    if aa <> invalid
        for each a in aa
            print "a"; a
        end for
        print "a"; a 'error
    end if
end sub

sub ok1()
    i = 0
    for i = 0 to 10
        print "i"; i
    end for
    print "i"; i
end sub

sub ok2()
    aa = {}
    if aa <> invalid
        a = invalid
        for each a in aa
            print "a"; a
        end for
        print "a"; a
    end if
end sub
