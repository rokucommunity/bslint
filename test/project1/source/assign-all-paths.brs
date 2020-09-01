sub error1()
    a = Rnd(10)
    if a > 0
        b = 0
    end if
    print "b"; b 'error
end sub

sub error2()
    a = Rnd(10)
    if a > 0
        b = 0
    elseif a > 1
        b = 1
    end if
    print "b"; b 'error
end sub

sub error3()
    a = Rnd(10)
    while a > 0
        if a > 0
            b = 0
        end if
        print "b"; b 'error
    end while
end sub

sub error4()
    a = Rnd(10)
    if a > 0
        if a > 1
            b = 1
        else
            b = 2
        end if
    else
        if a < -3
            b = 3
        end if
    end if
    print "b"; b 'error
end sub

sub error5()
    a = Rnd(10)
    while a > 0
        b = a
        a--
    end while
    print "b"; b 'error
end sub

sub ok1()
    a = Rnd(10)
    if a > 0
        b = 0
    else
        b = 1
    end if
    print "b"; b
end sub

sub ok2()
    a = Rnd(10)
    if a > 0
        b = 0
    elseif a > 1
        b = 1
    else
        b = 2
    end if
    print "b"; b
end sub

sub ok3()
    b = -1
    a = Rnd(10)
    while a > 0
        a = Rnd(10)
        if a > 0
            b = 0
        end if
        print "b"; b
    end while
end sub

sub ok4()
    a = Rnd(10)
    while a > 0
        b = -1
        a = Rnd(10)
        if a > 0
            b = 0
        end if
        print "b"; b
    end while
end sub

sub ok5()
    a = Rnd(10)
    if a > 0
        if a > 1
            b = 1
        else
            b = 2
        end if
    else
        b = 4
        if a < -3
            b = 3
        end if
    end if
    print "b"; b
end sub

sub ok6()
    a = Rnd(10)
    if a > 0
        b = 0
    elseif a > 1
        b = 1
    else
        ' dead branch
        return
    end if
    print "b"; b
end sub

sub ok7()
    a = Rnd(10)
    if a > 0
        if a > 1
            b = 1
        else
            ' dead branch
            return
        end if
    else
        b = 4
        if a < -3
            b = 3
        end if
    end if
    print "b"; b
end sub
